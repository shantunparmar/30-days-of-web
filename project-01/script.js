document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username-input');
    const auditButton = document.getElementById('audit-button');
    const profileInfoDiv = document.getElementById('profile-info');
    const errorMessage = document.getElementById('error-message');

    const profileNameSpan = document.getElementById('profile-name');
    const usernameDisplaySpan = document.getElementById('username-display');
    const followersSpan = document.getElementById('followers');
    const followingSpan = document.getElementById('following');
    const publicReposSpan = document.getElementById('public-repos');
    const bioStatusSpan = document.getElementById('bio-status');
    const websiteStatusSpan = document.getElementById('website-status');
    const profileGradeDiv = document.getElementById('profile-grade');
    const suggestionsList = document.getElementById('suggestions');

    auditButton.addEventListener('click', auditProfile);

    async function auditProfile() {
        const username = usernameInput.value.trim();
        if (!username) {
            showError("Please enter a GitHub username.");
            return;
        }

        resetUI();
        showError("Fetching data...", false);
        auditButton.disabled = true; // Disable button during fetch

        try {
            const userResponse = await fetch(`https://api.github.com/users/${username}`);
            if (!userResponse.ok) {
                if (userResponse.status === 404) {
                    throw new Error(`User '${username}' not found.`);
                } else {
                    throw new Error(`GitHub API error: ${userResponse.status}`);
                }
            }
            const userData = await userResponse.json();

            // Fetch repositories (limited to first page for simplicity)
            const reposResponse = await fetch(userData.repos_url + '?per_page=100');
            const reposData = await reposResponse.json();

            displayProfileData(userData, reposData);
            calculateAndDisplayAudit(userData, reposData);
            profileInfoDiv.style.display = 'block';
            showError("", false); // Clear any loading message

        } catch (error) {
            console.error("Audit failed:", error);
            showError(error.message || "Failed to fetch profile data. Please try again.");
            profileInfoDiv.style.display = 'none';
        } finally {
            auditButton.disabled = false; // Re-enable button
        }
    }

    function displayProfileData(user, repos) {
        profileNameSpan.textContent = user.login;
        usernameDisplaySpan.textContent = user.login;
        followersSpan.textContent = user.followers;
        followingSpan.textContent = user.following;
        publicReposSpan.textContent = user.public_repos;
        bioStatusSpan.textContent = user.bio ? user.bio.substring(0, 50) + (user.bio.length > 50 ? '...' : '') : 'N/A';
        websiteStatusSpan.textContent = user.blog ? 'Present' : 'Missing';
    }

    function calculateAndDisplayAudit(user, repos) {
        let score = 100; // Start with a perfect score
        const suggestions = [];

        // Check for bio
        if (!user.bio) {
            score -= 20;
            suggestions.push("Your profile is missing a bio. Add a concise summary of your skills and what you're passionate about!");
        } else if (user.bio.length < 30) {
            score -= 10;
            suggestions.push("Your bio is a bit short. Expand on your expertise or projects.");
        }

        // Check for website/blog
        if (!user.blog) {
            score -= 15;
            suggestions.push("Consider adding a link to your personal website, portfolio, or blog.");
        }

        // Check for pinned repositories (simple check: if user has fewer than 3 pinned, suggest adding more)
        const pinnedRepos = repos.filter(repo => repo.stargazers_count > 0 && repo.description); // Simplified
        if (pinnedRepos.length < 3 && user.public_repos > 0) {
            score -= 10;
            suggestions.push("Pin 3-5 of your best projects to showcase your work immediately.");
        }

        // Check repository descriptions
        const reposWithoutDescription = repos.filter(repo => !repo.description);
        if (reposWithoutDescription.length > 0 && repos.length > 0) {
            score -= Math.min(reposWithoutDescription.length * 2, 20); // Max 20 points deduction
            suggestions.push(`You have ${reposWithoutDescription.length} repositories without descriptions. Add clear, concise descriptions to all your public repos.`);
        }
        
        // Basic engagement (very simple: if less than 5 followers and >0 public repos)
        if (user.followers < 5 && user.public_repos > 0) {
            score -= 10;
            suggestions.push("Engage with the community! Star projects, open issues, or contribute to open source to grow your network.");
        }

        // Determine grade
        let grade;
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        else grade = 'F';

        profileGradeDiv.textContent = grade;
        profileGradeDiv.className = `grade ${grade}`; // Apply color class

        // Display suggestions
        suggestionsList.innerHTML = ''; // Clear previous suggestions
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<li>Great job! Your profile looks solid. Keep up the good work.</li>';
        } else {
            suggestions.forEach(s => {
                const li = document.createElement('li');
                li.textContent = s;
                suggestionsList.appendChild(li);
            });
        }
    }

    function resetUI() {
        profileInfoDiv.style.display = 'none';
        errorMessage.style.display = 'none';
        suggestionsList.innerHTML = '';
        profileGradeDiv.textContent = '';
        profileGradeDiv.className = 'grade';
    }

    function showError(message, isError = true) {
        errorMessage.textContent = message;
        errorMessage.style.display = message ? 'block' : 'none';
        errorMessage.style.color = isError ? '#d9534f' : '#f0ad4e'; // Red for error, orange for loading
    }
});

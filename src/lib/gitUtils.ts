// Git utilities for committing solutions and generating SOLUTIONS.md

import { RoadmapTopic } from '@/types';

export interface GitConfig {
  token: string;
  username: string;
  repo: string;
  branch?: string;
}

export interface CommitFileParams {
  config: GitConfig;
  fileName: string;
  fileContent: string;
  commitMessage: string;
}

export interface CommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}

/**
 * Commit a single file to GitHub
 */
export async function commitFileToGitHub(params: CommitFileParams): Promise<CommitResult> {
  const { config, fileName, fileContent, commitMessage } = params;
  const { token, username, repo, branch = 'main' } = config;

  try {
    const repoUrl = `https://api.github.com/repos/${username}/${repo}`;
    
    // Step 1: Get the current commit SHA of the branch
    const refResponse = await fetch(`${repoUrl}/git/ref/heads/${branch}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!refResponse.ok) {
      throw new Error(`Failed to get branch reference: ${refResponse.statusText}`);
    }
    
    const refData = await refResponse.json();
    const currentCommitSha = refData.object.sha;
    
    // Step 2: Get the tree SHA of the current commit
    const commitResponse = await fetch(`${repoUrl}/git/commits/${currentCommitSha}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!commitResponse.ok) {
      throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
    }
    
    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;
    
    // Step 3: Create a blob for the file content
    const blobResponse = await fetch(`${repoUrl}/git/blobs`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: fileContent,
        encoding: 'utf-8',
      }),
    });
    
    if (!blobResponse.ok) {
      throw new Error(`Failed to create blob: ${blobResponse.statusText}`);
    }
    
    const blobData = await blobResponse.json();
    const blobSha = blobData.sha;
    
    // Step 4: Create a new tree with the file
    const treeResponse = await fetch(`${repoUrl}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: fileName,
            mode: '100644', // file mode
            type: 'blob',
            sha: blobSha,
          },
        ],
      }),
    });
    
    if (!treeResponse.ok) {
      throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
    }
    
    const treeData = await treeResponse.json();
    const newTreeSha = treeData.sha;
    
    // Step 5: Create a new commit
    const newCommitResponse = await fetch(`${repoUrl}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [currentCommitSha],
      }),
    });
    
    if (!newCommitResponse.ok) {
      throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
    }
    
    const newCommitData = await newCommitResponse.json();
    const newCommitSha = newCommitData.sha;
    
    // Step 6: Update the reference to point to the new commit
    const updateRefResponse = await fetch(`${repoUrl}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });
    
    if (!updateRefResponse.ok) {
      throw new Error(`Failed to update reference: ${updateRefResponse.statusText}`);
    }
    
    const commitUrl = `https://github.com/${username}/${repo}/commit/${newCommitSha}`;
    
    return {
      success: true,
      commitSha: newCommitSha,
      commitUrl,
    };
  } catch (error) {
    console.error('Error committing to GitHub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate SOLUTIONS.md markdown table from roadmap topics
 */
export function generateSolutionsMarkdown(topics: RoadmapTopic[]): string {
  let markdown = '# LeetCode Solutions\n\n';
  markdown += 'Track of all solved problems with links to solutions and LeetCode problems.\n\n';
  markdown += '---\n\n';
  
  // Stats
  let totalProblems = 0;
  let completedProblems = 0;
  let easyCount = 0;
  let mediumCount = 0;
  let hardCount = 0;
  
  topics.forEach(topic => {
    topic.problems.forEach(problem => {
      totalProblems++;
      if (problem.status === 'completed') {
        completedProblems++;
        if (problem.difficulty === 'easy') easyCount++;
        if (problem.difficulty === 'medium') mediumCount++;
        if (problem.difficulty === 'hard') hardCount++;
      }
    });
  });
  
  markdown += '## Progress Summary\n\n';
  markdown += `- **Total Problems**: ${totalProblems}\n`;
  markdown += `- **Completed**: ${completedProblems} (${((completedProblems / totalProblems) * 100).toFixed(1)}%)\n`;
  markdown += `- **Easy**: ${easyCount} | **Medium**: ${mediumCount} | **Hard**: ${hardCount}\n\n`;
  markdown += '---\n\n';
  
  // Table by topic
  topics.forEach(topic => {
    const completedInTopic = topic.problems.filter(p => p.status === 'completed');
    
    if (completedInTopic.length === 0) return; // Skip topics with no completed problems
    
    markdown += `## ${topic.name}\n\n`;
    markdown += `*${topic.description}*\n\n`;
    markdown += '| # | Problem | Difficulty | LeetCode | Solution | Date Solved | Notes |\n';
    markdown += '|---|---------|------------|----------|----------|-------------|-------|\n';
    
    completedInTopic.forEach((problem, index) => {
      const problemNum = index + 1;
      const difficulty = problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1);
      const leetcodeLink = problem.leetcodeUrl 
        ? `[Link](${problem.leetcodeUrl})` 
        : '-';
      const solutionLink = problem.githubCommitUrl 
        ? `[Code](${problem.githubCommitUrl})` 
        : '-';
      const dateSolved = problem.completedDate 
        ? new Date(problem.completedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-';
      const notes = problem.notes?.trim() 
        ? problem.notes.replace(/\n/g, ' ').slice(0, 50) + (problem.notes.length > 50 ? '...' : '')
        : '-';
      
      markdown += `| ${problemNum} | ${problem.title} | ${difficulty} | ${leetcodeLink} | ${solutionLink} | ${dateSolved} | ${notes} |\n`;
    });
    
    markdown += '\n';
  });
  
  markdown += '---\n\n';
  markdown += `*Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n`;
  
  return markdown;
}

/**
 * Commit SOLUTIONS.md to GitHub
 */
export async function updateSolutionsFile(
  config: GitConfig,
  topics: RoadmapTopic[]
): Promise<CommitResult> {
  const markdown = generateSolutionsMarkdown(topics);
  
  return commitFileToGitHub({
    config,
    fileName: 'SOLUTIONS.md',
    fileContent: markdown,
    commitMessage: 'docs: Update SOLUTIONS.md with latest problems',
  });
}

/**
 * Load Git config from localStorage
 */
export function loadGitConfig(): GitConfig | null {
  try {
    const saved = localStorage.getItem('dsa-git-config');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load git config:', error);
    return null;
  }
}

/**
 * Save Git config to localStorage
 */
export function saveGitConfig(config: GitConfig): void {
  try {
    localStorage.setItem('dsa-git-config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save git config:', error);
  }
}


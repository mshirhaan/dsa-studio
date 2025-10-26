// Piston API integration for multi-language code execution
// Docs: https://github.com/engineer-man/piston

export interface PistonExecutionResult {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

export interface PistonLanguage {
  language: string;
  version: string;
  aliases: string[];
}

// Language mapping from our types to Piston
const languageMap: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'c++',
};

// Get Piston language name
export function getPistonLanguage(language: string): string {
  return languageMap[language] || 'javascript';
}

// Execute code using Piston API
export async function executeCode(
  language: string,
  code: string
): Promise<PistonExecutionResult> {
  const pistonLanguage = getPistonLanguage(language);
  
  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: pistonLanguage,
      version: '*', // Use latest version
      files: [
        {
          name: getFileName(language),
          content: code,
        },
      ],
      stdin: '',
      args: [],
      compile_timeout: 10000,
      run_timeout: 3000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.statusText}`);
  }

  return await response.json();
}

// Get appropriate file name for each language
function getFileName(language: string): string {
  const fileNames: Record<string, string> = {
    javascript: 'code.js',
    typescript: 'code.ts',
    python: 'code.py',
    java: 'Main.java', // Java requires specific naming
    cpp: 'code.cpp',
  };
  return fileNames[language] || 'code.txt';
}

// Get available languages (optional - for future use)
export async function getAvailableLanguages(): Promise<PistonLanguage[]> {
  const response = await fetch('https://emkc.org/api/v2/piston/runtimes');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch languages: ${response.statusText}`);
  }

  return await response.json();
}


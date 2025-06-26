/**
 * Colorful logger for Jane system
 * Uses ANSI escape codes to provide colored console output
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  brightGreen: '\x1b[92m',
  brightCyan: '\x1b[96m',
  brightBlue: '\x1b[94m',
};

// Text styles
const styles = {
  bold: '\x1b[1m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  reset: '\x1b[0m'
};

/**
 * Logger utility for consistent, colorful console output
 */
export const logger = {
  /**
   * Log informational message (cyan)
   */
  info: (message: string): void => {
    console.error(`${colors.cyan}${message}${colors.reset}`);
  },
  
  /**
   * Log success message (green)
   */
  success: (message: string): void => {
    console.error(`${colors.green}${message}${colors.reset}`);
  },
  
  /**
   * Log warning message (yellow)
   */
  warning: (message: string): void => {
    console.error(`${colors.yellow}${message}${colors.reset}`);
  },
  
  /**
   * Log error message (red)
   */
  error: (message: string): void => {
    console.error(`${colors.red}${message}${colors.reset}`);
  },
  
  /**
   * Log debug message (gray)
   */
  debug: (message: string): void => {
    if (process.env.DEBUG) {
      console.error(`${colors.gray}${message}${colors.reset}`);
    }
  },
  
  /**
   * Log section header (bold cyan)
   */
  header: (message: string): void => {
    console.error(`\n${styles.bold}${colors.brightCyan}=== ${message} ===${colors.reset}`);
  },
  
  /**
   * Log startup message (bright blue)
   */
  startup: (message: string): void => {
    console.error(`${styles.bold}${colors.brightBlue}${message}${colors.reset}`);
  },
  
  /**
   * Log system message (magenta)
   */
  system: (message: string): void => {
    console.error(`${colors.magenta}${message}${colors.reset}`);
  }
};

export default logger;
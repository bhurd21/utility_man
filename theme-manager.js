/**
 * Theme management for the Grid Solver extension
 */

window.GridSolverTheme = {
  // Theme definitions
  themes: {
    dark: {
      background: '#374151',
      backgroundSecondary: '#1F2937',
      text: '#FFFFFF',
      textSecondary: '#9CA3AF',
      border: '#374151',
      button: '#6B7280',
      buttonHover: '#4B5563',
      accent: '#60A5FA',
      warning: '#FCD34D',
      rowAlt: '#4B5563'
    },
    light: {
      background: '#FFFFFF',
      backgroundSecondary: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      button: '#D1D5DB',
      buttonHover: '#9CA3AF',
      accent: '#2563EB',
      warning: '#F59E0B',
      rowAlt: '#F3F4F6'
    }
  },

  // Current theme state
  currentTheme: 'dark',
  systemPreference: 'dark',

  /**
   * Initialize theme system
   */
  async init() {
    // Detect system preference
    this.systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    // Load user preference from storage
    try {
      const result = await chrome.storage.local.get(['themeMode']);
      const themeMode = result.themeMode || 'system';
      this.applyTheme(themeMode);
    } catch (error) {
      this.applyTheme('system');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      this.systemPreference = e.matches ? 'dark' : 'light';
      if (this.currentThemeMode === 'system') {
        this.applyTheme('system');
      }
    });
  },

  /**
   * Apply theme based on mode
   */
  applyTheme(mode) {
    this.currentThemeMode = mode;
    
    switch (mode) {
      case 'dark':
        this.currentTheme = 'dark';
        break;
      case 'light':
        this.currentTheme = 'light';
        break;
      case 'system':
      default:
        this.currentTheme = this.systemPreference;
        break;
    }
  },

  /**
   * Get current theme colors
   */
  getColors() {
    return this.themes[this.currentTheme];
  },

  /**
   * Get themed styles for solution container
   */
  getSolutionContainerStyles() {
    const colors = this.getColors();
    return `
      background: ${colors.background}; 
      color: ${colors.text}; 
      padding-left: 12px; 
      padding-right: 12px; 
      padding-bottom: 12px; 
      padding-top: 0px; 
      margin: 0;
      font: 11px/1.2 ui-monospace, monospace;
      max-height: 175px; 
      overflow: auto; 
      border-top: 1px solid ${colors.border};
    `;
  }
};

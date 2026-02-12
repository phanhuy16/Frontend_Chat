import React, { useState } from 'react';
import { Modal } from 'antd';
import { THEME_CONFIGS, ThemePreference } from '../../config/themes.config';
import { useTheme } from '../../context/ThemeContext';

interface ThemeSelectorProps {
  open: boolean;
  onClose: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ open, onClose }) => {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(currentTheme);

  const handleApply = () => {
    setTheme(selectedTheme);
    onClose();
  };

  const themeCategories = {
    basic: ['light', 'dark'] as ThemePreference[],
    gradients: ['gradient-ocean', 'gradient-sunset', 'gradient-forest'] as ThemePreference[],
    glass: ['glass-light', 'glass-dark'] as ThemePreference[],
  };

  const renderThemeCard = (themeKey: ThemePreference) => {
    const config = THEME_CONFIGS[themeKey];
    const isSelected = selectedTheme === themeKey;

    return (
      <div
        key={themeKey}
        onClick={() => setSelectedTheme(themeKey)}
        className={`relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
          isSelected ? 'ring-4 ring-primary scale-105' : 'hover:scale-102'
        }`}
        style={{ height: '120px' }}
      >
        {/* Theme Preview */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            background: config.gradients
              ? `linear-gradient(135deg, ${config.gradients.join(', ')})`
              : config.colors.background,
            backdropFilter: config.glassEffect ? 'blur(12px)' : 'none',
          }}
        >
          <div className="text-center px-4">
            <div
              className="text-sm font-semibold mb-1"
              style={{ color: config.colors.text }}
            >
              {config.displayName}
            </div>
            {config.glassEffect && (
              <span className="material-symbols-outlined text-2xl" style={{ color: config.colors.text }}>
                blur_on
              </span>
            )}
            {config.gradients && (
              <span className="material-symbols-outlined text-2xl" style={{ color: config.colors.text }}>
                gradient
              </span>
            )}
          </div>
        </div>
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
            <span className="material-symbols-outlined text-sm">check</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title="Chọn giao diện"
      open={open}
      onCancel={onClose}
      onOk={handleApply}
      okText="Áp dụng"
      cancelText="Hủy"
      width={600}
      className="theme-selector-modal"
    >
      <div className="space-y-6 py-4">
        {/* Basic Themes */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Cơ bản
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {themeCategories.basic.map(renderThemeCard)}
          </div>
        </div>

        {/* Gradient Themes */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Gradient
          </h4>
          <div className="grid grid-cols-3 gap-4">
            {themeCategories.gradients.map(renderThemeCard)}
          </div>
        </div>

        {/* Glass Themes */}
        <div>
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Glassmorphism
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {themeCategories.glass.map(renderThemeCard)}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ThemeSelector;

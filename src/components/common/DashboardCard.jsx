import React from 'react';

export const DashboardCard = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  badge,
  badgeText,
  onClick
}) => {
  const colorMap = {
    primary: { bg: '#e8f5e9', color: '#0f5132' },
    secondary: { bg: '#fff8e1', color: '#8a6b12' },
    info: { bg: '#e8f5e9', color: '#0f5132' },
    warning: { bg: '#fff8e1', color: '#8a6b12' },
    danger: { bg: '#e8f5e9', color: '#0f5132' },
    purple: { bg: '#e8f5e9', color: '#0f5132' }
  };

  const currentTheme = colorMap[color] || colorMap.primary;

  return (
    <div
      className={`stat-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div
        className="stat-icon-wrapper"
        style={{ backgroundColor: currentTheme.bg, color: currentTheme.color }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="flex-grow-1 overflow-hidden">
        <div className="text-muted small fw-medium text-truncate">{title}</div>
        <div className="fs-4 fw-bold text-dark mt-1 text-truncate">{value}</div>
        {(subtitle || badgeText) && (
          <div className="d-flex align-items-center gap-2 mt-1">
            {badgeText && (
              <span className={`badge bg-${badge || 'secondary'} rounded-pill`}>
                {badgeText}
              </span>
            )}
            {subtitle && <span className="small text-muted text-truncate">{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';

const STATUS_CONFIG = {
  Pending: {
    bgClass: 'status-badge-pending',
    icon: 'bi-clock-history',
    text: 'Pending'
  },
  Processing: {
    bgClass: 'status-badge-processing',
    icon: 'bi-arrow-repeat',
    text: 'Processing'
  },
  Approved: {
    bgClass: 'status-badge-approved',
    icon: 'bi-check-circle-fill',
    text: 'Approved'
  },
  Verified: {
    bgClass: 'status-badge-verified',
    icon: 'bi-patch-check-fill',
    text: 'Verified'
  },
  Signed: {
    bgClass: 'status-badge-signed',
    icon: 'bi-pen-fill',
    text: 'Signed'
  },
  Released: {
    bgClass: 'status-badge-released',
    icon: 'bi-file-earmark-check-fill',
    text: 'Released'
  },
  Validated: {
    bgClass: 'status-badge-validated',
    icon: 'bi-shield-fill-check',
    text: 'Validated'
  },
  Encoded: {
    bgClass: 'status-badge-encoded',
    icon: 'bi-keyboard-fill',
    text: 'Encoded'
  },
  Confirmed: {
    bgClass: 'status-badge-confirmed',
    icon: 'bi-check2-all',
    text: 'Confirmed'
  },
  Active: {
    bgClass: 'status-badge-approved',
    icon: 'bi-check-circle',
    text: 'Active'
  },
  Inactive: {
    bgClass: 'status-badge-rejected',
    icon: 'bi-x-circle',
    text: 'Inactive'
  },
  Open: {
    bgClass: 'status-badge-approved',
    icon: 'bi-door-open-fill',
    text: 'Open'
  },
  Closed: {
    bgClass: 'status-badge-rejected',
    icon: 'bi-door-closed-fill',
    text: 'Closed'
  },
  Full: {
    bgClass: 'status-badge-rejected',
    icon: 'bi-people-fill',
    text: 'Section Full'
  },
  Rejected: {
    bgClass: 'status-badge-rejected',
    icon: 'bi-x-circle-fill',
    text: 'Rejected'
  },
  'Clearance Complete': {
    bgClass: 'status-badge-approved',
    icon: 'bi-check-all',
    text: 'Clearance Complete'
  },
  'Clearance Pending': {
    bgClass: 'status-badge-pending',
    icon: 'bi-hourglass-split',
    text: 'Clearance Pending'
  }
};

export const StatusBadge = ({ status, customLabel, size = 'normal' }) => {
  const config = STATUS_CONFIG[status] || {
    bgClass: 'bg-secondary text-white',
    icon: 'bi-info-circle',
    text: status || 'Unknown'
  };

  const label = customLabel || config.text;

  return (
    <span className={`status-badge ${config.bgClass} ${size === 'sm' ? 'py-1 px-2' : ''}`}>
      <i className={`bi ${config.icon}`}></i>
      <span>{label}</span>
    </span>
  );
};

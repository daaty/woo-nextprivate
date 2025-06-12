import React from 'react';

// Componente Apple Logo SVG
export const AppleLogo = ({ width = 24, height = 24, color = "currentColor", className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 384 512" 
    width={width} 
    height={height} 
    className={className}
    fill={color}
  >
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
);

// Componente Xiaomi Logo SVG
export const XiaomiLogo = ({ width = 24, height = 24, color = "currentColor", className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={width} 
    height={height} 
    className={className}
    fill={color}
  >
    <path d="M256 42.67C138.24 42.67 42.67 138.24 42.67 256S138.24 469.33 256 469.33 469.33 373.76 469.33 256 373.76 42.67 256 42.67zm-82.69 290.09h-29.88V179.24h29.88v153.52zm166.34 0h-29.78v-74.1h-61.33v74.1h-29.78V179.24h29.78v54.18h61.33v-54.18h29.78v153.52z"/>
  </svg>
);

// Componente Samsung Logo SVG
export const SamsungLogo = ({ width = 24, height = 24, color = "currentColor", className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={width} 
    height={height} 
    className={className}
    fill={color}
  >
    <path d="M255.95 120c-69.53 0-118.78 19.75-118.78 55.22v161.56c0 35.47 49.25 55.22 118.78 55.22s118.78-19.75 118.78-55.22V175.22c0-35.47-49.25-55.22-118.78-55.22zm0 22.93c53.72 0 95.84 12.99 95.84 32.29 0 19.3-42.12 32.29-95.84 32.29s-95.84-12.99-95.84-32.29c0-19.3 42.12-32.29 95.84-32.29zm0 206.15c-55.61 0-95.84-14.26-95.84-37.37V281.9c23.17 18.13 60.79 24.8 95.84 24.8s72.67-6.67 95.84-24.8v29.81c0 23.11-40.23 37.37-95.84 37.37zm0-78.1c-55.61 0-95.84-14.21-95.84-37.37v-25.92c23.17 18.13 60.79 24.8 95.84 24.8s72.67-6.67 95.84-24.8v25.92c0 23.16-40.23 37.37-95.84 37.37z"/>
  </svg>
);

// Componente Motorola Logo SVG
export const MotorolaLogo = ({ width = 24, height = 24, color = "currentColor", className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={width} 
    height={height} 
    className={className}
    fill={color}
  >
    <path d="M256 120c-75.15 0-136 60.85-136 136s60.85 136 136 136 136-60.85 136-136-60.85-136-136-136zm25.59 222.27h-51.18V229.73c0-14.14 11.45-25.59 25.59-25.59s25.59 11.45 25.59 25.59v112.54zm-25.59-163.72c-10.61 0-19.2-8.6-19.2-19.2 0-10.61 8.6-19.2 19.2-19.2 10.61 0 19.2 8.6 19.2 19.2 0 10.61-8.6 19.2-19.2 19.2z"/>
  </svg>
);

// Componente para o botão "Ver Todos" com todas as 4 marcas juntas
export const AllBrandsLogo = ({ width = 24, height = 24, color = "currentColor", className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={width} 
    height={height} 
    className={className}
    fill={color}
  >
    <path d="M128 166c0-13.3 10.7-24 24-24h48c13.3 0 24 10.7 24 24v180c0 13.3-10.7 24-24 24h-48c-13.3 0-24-10.7-24-24V166z"/>
    <path d="M288 166c0-13.3 10.7-24 24-24h48c13.3 0 24 10.7 24 24v180c0 13.3-10.7 24-24 24h-48c-13.3 0-24-10.7-24-24V166z"/>
    <path d="M128 352h256v32H128v-32z"/>
    <path d="M128 128h256v32H128v-32z"/>
  </svg>
);
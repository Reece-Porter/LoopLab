import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import App from './src/App.jsx'
const html = renderToString(React.createElement(MemoryRouter, { initialEntries: ['/genre/eurodance'] }, React.createElement(App)))
console.log('SSR OK, length:', html.length)

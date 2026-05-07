const fs = require('fs');
const path = require('path');
const srcDir = 'c:/Users/Asus/Desktop/taskflow/frontend/src';

const filesToFix = [
  'api/client.js',
  'components/Layout.jsx',
  'components/ProtectedRoute.jsx',
  'contexts/AuthContext.jsx',
  'pages/Dashboard.jsx',
  'pages/Login.jsx',
  'pages/Projects.jsx',
  'pages/Register.jsx'
];

filesToFix.forEach(f => {
  let p = path.join(srcDir, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    if (content.startsWith('"')) {
      content = content.replace(/^"/, '');
      content = content.replace(/"\s*(Observation:.*)?$/, '');
      content = content.replace(/\\"/g, '"');
      fs.writeFileSync(p, content);
      console.log('Fixed ' + f);
    }
  }
});

let pdPath = path.join(srcDir, 'pages/ProjectDetail.jsx');
if (fs.existsSync(pdPath)) {
  let content = fs.readFileSync(pdPath, 'utf8');
  let match = content.match(/--file-text\s+"(.*)/s);
  if (match) {
    let jsContent = match[1];
    jsContent = jsContent.replace(/"\s*(Observation:.*)?$/, '');
    jsContent = jsContent.replace(/\\"/g, '"');
    fs.writeFileSync(pdPath, jsContent);
    console.log('Fixed ProjectDetail.jsx');
  }
}

let tmPath = path.join(srcDir, 'pages/TeamMembers.jsx');
if (fs.existsSync(tmPath)) {
  let content = fs.readFileSync(tmPath, 'utf8');
  let match = content.match(/--file-text\s+"(.*)/s);
  if (match) {
    let jsContent = match[1];
    jsContent = jsContent.replace(/"\s*(Observation:.*)?$/, '');
    jsContent = jsContent.replace(/\\"/g, '"');
    fs.writeFileSync(tmPath, jsContent);
    console.log('Fixed TeamMembers.jsx');
  }
}

let cssPath = path.join(srcDir, 'App.css');
if (fs.existsSync(cssPath)) {
  let content = fs.readFileSync(cssPath, 'utf8');
  let idx = content.indexOf('      />');
  if (idx !== -1) {
    fs.writeFileSync(cssPath, content.substring(0, idx).trimEnd() + '\n');
    console.log('Fixed App.css');
  }
}
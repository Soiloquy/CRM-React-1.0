import { execSync } from 'child_process'

execSync('npx msw init ./public --save', { 
  cwd: '/vercel/share/v0-project',
  stdio: 'inherit' 
})

module.exports = loadSkills

const fs = require('fs')
const path = require('path')

function loadSkills(dir) {
  const skills = {}

  function walk(currentPath) {
    const files = fs.readdirSync(currentPath)

    for (const file of files) {
      const fullPath = path.join(currentPath, file)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        walk(fullPath)
      } else if (file.endsWith('.js')) {
        const skill = require(fullPath)

        if (skill.name && skill.execute) {
          skills[skill.name] = skill
        }
      }
    }
  }

  walk(dir)
  return skills
}

module.exports = loadSkills
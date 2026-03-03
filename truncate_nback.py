import sys
import re

file_path = 'src/components/BrainTrainer/NBackGame.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# We only want the first "export default NBackGame;"
matches = list(re.finditer(r"export default NBackGame;", content))
if not matches:
    print("Could not find export default!")
    sys.exit(1)

# Truncate anything after the first match
first_match_end = matches[0].end()
content = content[:first_match_end]

with open(file_path, 'w') as f:
    f.write(content + '\n')

print("Truncated file successfully at index:", first_match_end)

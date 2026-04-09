with open("src/components/PatternFoundations.tsx", "r") as f:
    lines = f.readlines()

new_lines = lines[:221] + [
"              >\n",
"                Extensive (29)\n",
"              </button>\n",
"            </div>\n",
"          </div>\n",
"        </header>\n"
] + lines[226:]

with open("src/components/PatternFoundations.tsx", "w") as f:
    f.writelines(new_lines)

with open("src/components/PatternFoundations.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
for idx, line in enumerate(lines):
    if line.rstrip() == "                  Extensive (29)":
        new_lines.append("                Extensive (29)\n")
    elif line.rstrip() == "                </button>" and lines[idx-1].rstrip() == "                Extensive (29)":
        new_lines.append("              </button>\n")
    elif line.rstrip() == "              </div>" and lines[idx-1].rstrip() == "              </button>":
        new_lines.append("            </div>\n")
    elif line.rstrip() == "            </div>" and lines[idx-1].rstrip() == "            </div>":
        new_lines.append("          </div>\n        </header>\n")
    else:
        new_lines.append(line)

with open("src/components/PatternFoundations.tsx", "w") as f:
    f.writelines(new_lines)

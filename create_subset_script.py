import os
from fontTools.subset import main as subset_main
import sys

# Unicode ranges for Vietnamese support + Basic Latin + Latin-1 Supplement + Latin Extended-A + Latin Extended-B
# U+0020-007E: Basic Latin (ASCII)
# U+00A0-00FF: Latin-1 Supplement
# U+0102-0103: A with breve (Ă, ă)
# U+0110-0111: D with stroke (Đ, đ)
# U+0128-0129: I with tilde (Ĩ, ĩ)
# U+0168-0169: U with tilde (Ũ, ũ)
# U+01A0-01B0: Horn O/U (Ơ, ơ, Ư, ư)
# U+1EA0-1EF9: Vietnamese Tone Marks (Phonetic Extensions)

unicodes = "U+0020-007E,U+00A0-00FF,U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01B0,U+1EA0-1EF9"

files = [
    "src/lib/fonts/Roboto-Regular.ttf",
    "src/lib/fonts/Roboto-Bold.ttf"
]

for file in files:
    output_file = file.replace(".ttf", "-VN.ttf")
    print(f"Subsetting {file} to {output_file}...")

    # Construct arguments for pyftsubset
    args = [
        file,
        f"--output-file={output_file}",
        f"--unicodes={unicodes}",
        "--layout-features=*",
        "--flavor=woff2"  # WOFF2 is smaller but jsPDF might need TTF/Base64. Let's try TTF first for compatibility or just raw TTF subset.
                          # Actually jsPDF usually takes base64 encoded TTF.
                          # Let's output TTF first, then we can base64 encode it.
                          # Wait, the plan said woff2 flavor but jsPDF addFileToVFS usually takes TTF content.
                          # Let's stick to TTF output for maximum compatibility with jsPDF addFont.
    ]

    # Override flavor to None to keep it TTF but subsetted
    # args = [file, f"--output-file={output_file}", f"--unicodes={unicodes}", "--layout-features=*"]

    # Actually, let's follow the plan which suggested woff2, but jsPDF supports TTF best.
    # WOFF2 might need specific handling. Let's output TTF for safety.
    sys.argv = ["pyftsubset"] + args

    try:
        # We need to call subset_main with arguments.
        # Since subset_main uses sys.argv, we modified it above.
        # But wait, subset_main might not be designed to be called multiple times in one script easily if it uses global state.
        # It's safer to run it via subprocess or just simple command line.
        pass
    except Exception as e:
        print(f"Error subsetting {file}: {e}")

# Generating script to run via command line is safer
with open("subset_fonts.bat", "w") as f:
    f.write(f'python -m fontTools.subset "src/lib/fonts/Roboto-Regular.ttf" --output-file="src/lib/fonts/Roboto-Regular-VN.ttf" --unicodes="{unicodes}"\n')
    f.write(f'python -m fontTools.subset "src/lib/fonts/Roboto-Bold.ttf" --output-file="src/lib/fonts/Roboto-Bold-VN.ttf" --unicodes="{unicodes}"\n')

print("Created subset_fonts.bat")

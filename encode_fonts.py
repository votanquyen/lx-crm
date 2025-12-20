import base64
import os

files = [
    "src/lib/fonts/Roboto-Regular-VN.ttf",
    "src/lib/fonts/Roboto-Bold-VN.ttf"
]

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode('utf-8')

        output_path = file_path.replace(".ttf", "-base64.txt")
        # Rename to lowercase for consistency with plan
        output_path = output_path.replace("Roboto-Regular-VN", "roboto-regular-vn").replace("Roboto-Bold-VN", "roboto-bold-vn")

        with open(output_path, "w") as f:
            f.write(encoded)
        print(f"Encoded {file_path} to {output_path}")
    else:
        print(f"File not found: {file_path}")

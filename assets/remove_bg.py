import sys

try:
    from PIL import Image
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def remove_bg(img_path, output_path, bg_color=(17, 17, 17), tolerance=20):
    img = Image.open(img_path).convert("RGBA")
    data = img.getdata()
    new_data = []
    
    for item in data:
        r, g, b, a = item
        # If the pixel is very dark (close to the dark background color)
        if r < 30 and g < 30 and b < 30:
            new_data.append((r, g, b, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved {output_path}")

if __name__ == '__main__':
    remove_bg(r"c:\Users\Kanishk\Downloads\portfolio\assets\cloud.png", r"c:\Users\Kanishk\Downloads\portfolio\assets\cloud_transparent.png")

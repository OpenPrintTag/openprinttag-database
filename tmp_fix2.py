import os, re, subprocess

BASE = '/home/cristinaruizguerrero/Documents/fork'
PKGS = os.path.join(BASE, 'data/material-packages/esun')

def rename_pkg(old_name, new_name):
    src = os.path.join(PKGS, old_name + '.yaml')
    dst = os.path.join(PKGS, new_name + '.yaml')
    with open(src) as f:
        content = f.read()
    content = re.sub(r'^slug: ' + re.escape(old_name) + r'$', 'slug: ' + new_name, content, flags=re.M)
    with open(src, 'w') as f:
        f.write(content)
    subprocess.run(['git', 'mv', src, dst], cwd=BASE, check=True)
    print(f'  {old_name} -> {new_name}')

# 1. esun-carbon-fiber-abs-{color}-1kg -> esun-abs-cf-{color}-1kg
print('Renaming carbon-fiber-abs packages...')
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-carbon-fiber-abs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    # esun-carbon-fiber-abs-dark-blue-1kg -> esun-abs-cf-dark-blue-1kg
    new_b = re.sub(r'^esun-carbon-fiber-abs-', 'esun-abs-cf-', b)
    rename_pkg(b, new_b)

# 2. esun-high-speed-abs-{color}-1kg -> esun-abs-pro-hs-{color}-1kg
print('Renaming high-speed-abs packages...')
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-high-speed-abs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    # esun-high-speed-abs-black-1kg -> esun-abs-pro-hs-black-1kg
    new_b = re.sub(r'^esun-high-speed-abs-', 'esun-abs-pro-hs-', b)
    rename_pkg(b, new_b)

print('All done!')

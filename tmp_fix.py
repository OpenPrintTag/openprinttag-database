import os, re, subprocess

BASE = '/home/cristinaruizguerrero/Documents/fork'
PKGS = os.path.join(BASE, 'data/material-packages/esun')

# 1. Fix esun-high-speed-abs-* packages: update material.slug to esun-abs-pro-hs-*
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-high-speed-abs-') or not fn.endswith('.yaml'):
        continue
    path = os.path.join(PKGS, fn)
    with open(path) as f:
        content = f.read()
    # esun-high-speed-abs-{color} -> esun-abs-pro-hs-{color}
    new_content = re.sub(
        r'(  slug: )esun-high-speed-abs-(.+)',
        r'\1esun-abs-pro-hs-\2',
        content
    )
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f'Fixed HS package: {fn}')

# 2. Fix esun-carbon-fiber-abs-* packages: update material.slug to esun-abs-cf-*
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-carbon-fiber-abs-') or not fn.endswith('.yaml'):
        continue
    path = os.path.join(PKGS, fn)
    with open(path) as f:
        content = f.read()
    # esun-carbon-fiber-abs-{color} -> esun-abs-cf-{color}
    new_content = re.sub(
        r'(  slug: )esun-carbon-fiber-abs-(.+)',
        r'\1esun-abs-cf-\2',
        content
    )
    if new_content != content:
        with open(path, 'w') as f:
            f.write(new_content)
        print(f'Fixed CF package: {fn}')

# 3. Delete orphaned esun-abs-pro-white-1kg.yaml (material was removed from catalog)
white_pkg = os.path.join(PKGS, 'esun-abs-pro-white-1kg.yaml')
if os.path.exists(white_pkg):
    subprocess.run(['git', 'rm', white_pkg], cwd=BASE, check=True)
    print('Deleted orphaned package: esun-abs-pro-white-1kg.yaml')

print('All fixes applied!')

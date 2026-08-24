import os, subprocess, re

BASE = '/home/cristinaruizguerrero/Documents/fork'
MATS = os.path.join(BASE, 'data/materials/esun')
PKGS = os.path.join(BASE, 'data/material-packages/esun')

def rename(src_dir, old, new):
    src = os.path.join(src_dir, old + '.yaml')
    dst = os.path.join(src_dir, new + '.yaml')
    with open(src) as f:
        content = f.read()
    # Replace top-level slug
    content = re.sub(r'^slug: ' + re.escape(old) + r'$', 'slug: ' + new, content, flags=re.M)
    # Replace material.slug (indented slug)
    content = re.sub(r'^  slug: ' + re.escape(old) + r'$', '  slug: ' + new, content, flags=re.M)
    with open(src, 'w') as f:
        f.write(content)
    subprocess.run(['git', 'mv', src, dst], cwd=BASE, check=True)
    print(f'  {old} -> {new}')

print('Renaming ABS+ materials...')
for fn in sorted(os.listdir(MATS)):
    if not fn.startswith('esun-abs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    if '-hs-' in b or '-cf-' in b:
        continue
    rename(MATS, b, b.replace('esun-abs-', 'esun-abs-pro-', 1))

print('Renaming ABS+HS materials...')
for fn in sorted(os.listdir(MATS)):
    if not fn.startswith('esun-abs-hs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    rename(MATS, b, b.replace('esun-abs-hs-', 'esun-abs-pro-hs-', 1))

print('Renaming ABS+ packages...')
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-abs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    if '-hs-' in b or '-cf-' in b:
        continue
    new_b = b.replace('esun-abs-', 'esun-abs-pro-', 1)
    # Also fix material.slug reference inside the file
    # The material slug is the package slug without the weight suffix
    mat_old = re.sub(r'-\d+kg$', '', b)
    mat_new = mat_old.replace('esun-abs-', 'esun-abs-pro-', 1)
    src = os.path.join(PKGS, b + '.yaml')
    with open(src) as f:
        content = f.read()
    content = re.sub(r'^slug: ' + re.escape(b) + r'$', 'slug: ' + new_b, content, flags=re.M)
    content = re.sub(r'^  slug: ' + re.escape(mat_old) + r'$', '  slug: ' + mat_new, content, flags=re.M)
    with open(src, 'w') as f:
        f.write(content)
    dst = os.path.join(PKGS, new_b + '.yaml')
    subprocess.run(['git', 'mv', src, dst], cwd=BASE, check=True)
    print(f'  {b} -> {new_b}')

print('Renaming ABS+HS packages...')
for fn in sorted(os.listdir(PKGS)):
    if not fn.startswith('esun-abs-hs-') or not fn.endswith('.yaml'):
        continue
    b = fn[:-5]
    new_b = b.replace('esun-abs-hs-', 'esun-abs-pro-hs-', 1)
    mat_old = re.sub(r'-\d+kg$', '', b)
    mat_new = mat_old.replace('esun-abs-hs-', 'esun-abs-pro-hs-', 1)
    src = os.path.join(PKGS, b + '.yaml')
    with open(src) as f:
        content = f.read()
    content = re.sub(r'^slug: ' + re.escape(b) + r'$', 'slug: ' + new_b, content, flags=re.M)
    content = re.sub(r'^  slug: ' + re.escape(mat_old) + r'$', '  slug: ' + mat_new, content, flags=re.M)
    with open(src, 'w') as f:
        f.write(content)
    dst = os.path.join(PKGS, new_b + '.yaml')
    subprocess.run(['git', 'mv', src, dst], cwd=BASE, check=True)
    print(f'  {b} -> {new_b}')

print('All done!')

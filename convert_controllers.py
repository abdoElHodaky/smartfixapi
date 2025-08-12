#!/usr/bin/env python3
"""
Script to convert controller methods from asyncHandler pattern to modern async/await pattern
"""

import re
import os
import sys

def convert_method(content):
    """Convert a single method from asyncHandler pattern to modern pattern"""
    
    # Pattern to match asyncHandler methods
    pattern = r'(\s*)(\w+)\s*=\s*this\.asyncHandler\(async\s*\((.*?)\):\s*Promise<void>\s*=>\s*\{'
    
    def replace_method(match):
        indent = match.group(1)
        method_name = match.group(2)
        params = match.group(3)
        
        return f'{indent}async {method_name}({params}): Promise<void> {{\n{indent}  try {{'
    
    # Replace the method signature
    content = re.sub(pattern, replace_method, content)
    
    # Replace the closing pattern
    content = re.sub(r'\s*\}\);\s*$', '\n    }\n  }', content, flags=re.MULTILINE)
    
    return content

def convert_validation_patterns(content):
    """Convert @Validate decorators to @UseMiddleware"""
    
    # Remove @Validate decorators and their content
    content = re.sub(r'@Validate\(\{[^}]*\}\)\s*\n', '', content)
    
    # Remove validation logic inside methods
    validation_pattern = r'const validation = this\.validateRequest\([^;]*;\s*if \(!validation\.isValid\) \{[^}]*\}\s*'
    content = re.sub(validation_pattern, '', content, flags=re.DOTALL)
    
    return content

def process_file(filepath):
    """Process a single controller file"""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    
    # Convert methods
    content = convert_method(content)
    
    # Convert validation patterns
    content = convert_validation_patterns(content)
    
    # Move try block to wrap the entire method body
    def fix_try_blocks(match):
        indent = match.group(1)
        method_signature = match.group(2)
        method_body = match.group(3)
        
        # Move logRequest inside try block
        if 'this.logRequest' in method_body:
            log_match = re.search(r'(\s*this\.logRequest[^;]*;)', method_body)
            if log_match:
                log_statement = log_match.group(1)
                method_body = method_body.replace(log_statement, '')
                method_body = f'\n{indent}    {log_statement.strip()}\n{method_body}'
        
        return f'{indent}{method_signature} {{\n{indent}  try {{{method_body}\n{indent}  }}\n{indent}}}'
    
    # Apply the fix
    pattern = r'(\s*)(async \w+\([^)]*\): Promise<void>)\s*\{\s*try\s*\{(.*?)\s*\}\s*\}'
    content = re.sub(pattern, fix_try_blocks, content, flags=re.DOTALL)
    
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"✅ Updated {filepath}")
        return True
    else:
        print(f"⏭️  No changes needed for {filepath}")
        return False

def main():
    """Main function"""
    controller_files = [
        'src/controllers/chat/ChatController.modern.ts',
        'src/controllers/provider/ProviderController.modern.ts',
        'src/controllers/request/RequestController.modern.ts',
        'src/controllers/review/ReviewController.modern.ts',
        'src/controllers/user/UserController.modern.ts'
    ]
    
    updated_files = []
    
    for filepath in controller_files:
        if os.path.exists(filepath):
            if process_file(filepath):
                updated_files.append(filepath)
        else:
            print(f"⚠️  File not found: {filepath}")
    
    if updated_files:
        print(f"\n✅ Successfully updated {len(updated_files)} files:")
        for filepath in updated_files:
            print(f"  - {filepath}")
    else:
        print("\n⏭️  No files were updated")

if __name__ == '__main__':
    main()


#!/bin/bash

echo "🔧 Semantic Release Version Conflict Fixer"
echo "=========================================="
echo ""

# Check current status
echo "📊 Current Status:"
echo "- Local latest tag: $(git describe --tags --abbrev=0)"
echo "- Package.json version: $(node -p "require('./package.json').version")"
echo "- Remote latest tag: $(git ls-remote --tags origin | grep -v '{}' | tail -1 | awk '{print $2}' | sed 's|refs/tags/||')"
echo ""

echo "🎯 Solution: Push local tags to remote"
echo "This will sync v2.4.1 and v2.4.2 tags with remote repository"
echo ""

read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing tags to remote..."
    
    # Try to push the missing tags
    if git push origin v2.4.1 v2.4.2; then
        echo "✅ Tags pushed successfully!"
        echo ""
        echo "🎉 Semantic-release should now work correctly."
        echo "Next release will be calculated from v2.4.2"
    else
        echo "❌ Failed to push tags. Trying alternative solution..."
        echo ""
        echo "Alternative: Force push all tags"
        read -p "Force push all tags? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push --tags --force
            echo "✅ All tags force pushed!"
        else
            echo "📝 Manual steps required:"
            echo "1. Fix SSH connection or use HTTPS:"
            echo "   git remote set-url origin https://github.com/MarkShawn2020/claude-code-manager.git"
            echo ""
            echo "2. Push the tags:"
            echo "   git push origin v2.4.1 v2.4.2"
            echo ""
            echo "3. Or if you want to reset everything:"
            echo "   git tag -d v2.4.1 v2.4.2"
            echo "   npm version 2.4.0 --no-git-tag-version"
            echo "   git add package.json"
            echo "   git commit -m 'chore: reset version for semantic-release'"
            echo "   npm run release"
        fi
    fi
else
    echo "❌ Operation cancelled"
    echo ""
    echo "📝 To fix manually, run:"
    echo "git push origin v2.4.1 v2.4.2"
fi
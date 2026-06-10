'use client';

import React, { useState, useMemo } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { cn, getFileIcon } from '@/lib/utils';
import type { GitHubFile } from '@/types';

interface CodeMapProps {
  fileTree: GitHubFile[];
  highlightedFiles?: string[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children: TreeNode[];
  size?: number;
}

function buildTree(files: GitHubFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Sort files: directories first, then alphabetically
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'dir' ? -1 : 1;
    }
    return a.path.localeCompare(b.path);
  });

  for (const file of sortedFiles) {
    const parts = file.path.split('/');
    let currentPath = '';
    let parent: TreeNode[] = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      let node = nodeMap.get(currentPath);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isLast ? file.type : 'dir',
          children: [],
          size: isLast ? file.size : undefined,
        };
        nodeMap.set(currentPath, node);
        parent.push(node);
      }

      parent = node.children;
    }
  }

  return root;
}

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  highlightedFiles?: string[];
}

function TreeItem({ node, depth, highlightedFiles = [] }: TreeItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const isHighlighted = highlightedFiles.includes(node.path);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer file-tree-item',
          'hover:bg-hacker-primary/10 transition-colors',
          isHighlighted && 'bg-hacker-primary/20 border-l-2 border-hacker-primary'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.type === 'dir' && setIsOpen(!isOpen)}
      >
        {node.type === 'dir' ? (
          <>
            {hasChildren ? (
              isOpen ? (
                <ChevronDown className="w-4 h-4 text-hacker-text-muted flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-hacker-text-muted flex-shrink-0" />
              )
            ) : (
              <span className="w-4" />
            )}
            <Folder
              className={cn(
                'w-4 h-4 flex-shrink-0',
                isOpen ? 'text-hacker-warning' : 'text-hacker-text-muted'
              )}
            />
          </>
        ) : (
          <>
            <span className="w-4" />
            <span className="text-sm">{getFileIcon(node.name)}</span>
          </>
        )}
        <span
          className={cn(
            'text-sm terminal-text truncate',
            node.type === 'dir' ? 'text-hacker-text' : 'text-hacker-text-muted',
            isHighlighted && 'text-hacker-primary font-medium'
          )}
        >
          {node.name}
        </span>
        {node.size && (
          <span className="text-xs text-hacker-text-dim ml-auto">
            {(node.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>

      {node.type === 'dir' && isOpen && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              highlightedFiles={highlightedFiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CodeMap({ fileTree, highlightedFiles = [] }: CodeMapProps) {
  const tree = useMemo(() => buildTree(fileTree), [fileTree]);

  const stats = useMemo(() => {
    const dirs = fileTree.filter((f) => f.type === 'dir').length;
    const files = fileTree.filter((f) => f.type === 'file').length;
    return { dirs, files };
  }, [fileTree]);

  return (
    <div className="bg-hacker-bg-secondary border border-hacker-border rounded-lg overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-hacker-border bg-hacker-bg-tertiary flex-shrink-0">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-hacker-secondary" />
          <h2 className="font-semibold text-hacker-text">Code Map</h2>
        </div>
        <p className="mt-1 text-xs text-hacker-text-dim terminal-text">
          {stats.dirs} directories, {stats.files} files
        </p>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto p-2">
        {tree.map((node) => (
          <TreeItem
            key={node.path}
            node={node}
            depth={0}
            highlightedFiles={highlightedFiles}
          />
        ))}
      </div>
    </div>
  );
}

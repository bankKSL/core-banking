import React, { useMemo } from "react";
import { ChevronRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Office } from "@/types";

interface TreeNode {
  office: Office;
  children: TreeNode[];
}

interface OfficeTreeProps {
  offices: Office[];
  selectedId?: number | null;
  onSelect?: (office: Office) => void;
}

const OfficeTree: React.FC<OfficeTreeProps> = ({ offices, selectedId, onSelect }) => {
  const tree = useMemo(() => buildTree(offices), [offices]);

  if (!tree.length) {
    return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No offices found.</p>;
  }

  return (
    <div className="space-y-1">
      {tree.map((node) => (
        <TreeNodeItem key={node.office.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
};

function TreeNodeItem({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedId?: number | null;
  onSelect?: (office: Office) => void;
}) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.office.id;

  return (
    <div>
      <button
        onClick={() => {
          setExpanded(!expanded);
          onSelect?.(node.office);
        }}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
          isSelected && "bg-red-50 text-[#D32F2F] dark:bg-red-950 dark:text-red-400",
        )}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", expanded && "rotate-90")}
          />
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{node.office.name}</span>
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.office.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Build a tree from a flat list using parentId */
function buildTree(offices: Office[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  offices.forEach((o) => map.set(o.id, { office: o, children: [] }));

  offices.forEach((o) => {
    const node = map.get(o.id)!;
    if (o.parentId && map.has(o.parentId)) {
      map.get(o.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default OfficeTree;

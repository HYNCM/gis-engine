import type { MapSpecTemplate } from "../templates";

interface Props {
  templates: MapSpecTemplate[];
  activeTemplateId: string | null;
  onSelect: (template: MapSpecTemplate) => void;
}

export default function TemplateBar({ templates, activeTemplateId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 border-t border-gray-800 bg-gray-950 px-4 py-2.5 shrink-0 overflow-x-auto">
      <span className="shrink-0 text-[11px] text-gray-600 font-medium uppercase tracking-wider">Templates</span>
      <div className="flex items-center gap-1.5">
        {templates.map((tpl) => {
          const isActive = activeTemplateId === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              title={tpl.description}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                isActive
                  ? "border-blue-600 bg-blue-950/50 text-blue-100"
                  : "border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <span className="text-sm leading-none">{tpl.icon}</span>
              <span className="whitespace-nowrap">{tpl.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

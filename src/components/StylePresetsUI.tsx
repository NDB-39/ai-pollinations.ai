import React from 'react';
import { Palette } from 'lucide-react';

export const STYLE_PRESETS = [
  {
    id: '35mm-film',
    name: '35mm Cinematic Film',
    description: 'Phong cách chụp phim nhựa, hạt noise, màu phim hoài cổ',
    promptAddon: 'shot on 35mm film, cinematic lighting, film grain, vintage color grading, masterpiece, 8k resolution'
  },
  {
    id: 'studio-ghibli',
    name: 'Studio Ghibli',
    description: 'Phong cách hoạt hình Ghibli mộng mơ, màu nước',
    promptAddon: 'Studio Ghibli style, anime aesthetic, watercolor background, highly detailed, Hayao Miyazaki, vivid colors'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon, tối tăm, công nghệ tương lai',
    promptAddon: 'cyberpunk style, neon lights, dark alley, futuristic, hyper-realistic, 8k octane render'
  },
  {
    id: 'city-pop',
    name: '80s City Pop',
    description: 'Anime thập niên 80s, màu pastel tươi sáng',
    promptAddon: '1980s retro anime style, city pop aesthetic, pastel neon colors, nostalgic vibe, vintage manga'
  },
  {
    id: 'ukiyo-e',
    name: 'Khắc gỗ Ukiyo-e',
    description: 'Nghệ thuật truyền thống Nhật Bản thế kỷ 17',
    promptAddon: 'traditional Japanese Ukiyo-e woodblock print style, flat colors, line art, Katsushika Hokusai style'
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    description: 'Siêu thực, magenta & cyan, vhs glitch',
    promptAddon: 'vaporwave aesthetic, synthwave, magenta and cyan color palette, vhs glitch effect, surreal landscapes'
  },
  {
    id: 'macro',
    name: 'Nhiếp ảnh Macro',
    description: 'Cận cảnh chi tiết siêu vi, xóa phông mịt mù',
    promptAddon: 'macro photography, extreme close-up, extreme shallow depth of field, bokeh, highly detailed texture'
  },
  {
    id: 'isometric',
    name: 'Đồ họa Isometric 3D',
    description: 'Render góc phần tư, cute 3d',
    promptAddon: 'isometric 3d render, claymation style, cute low poly, octane render, soft studio lighting'
  }
];

interface StylePresetsUIProps {
  onApplyStyle: (promptAddon: string) => void;
}

export function StylePresetsUI({ onApplyStyle }: StylePresetsUIProps) {
  return (
    <div className="space-y-3 mt-4 mb-4 bg-studio-900/30 p-4 rounded-xl border border-studio-700/50">
      <div className="flex items-center gap-2 mb-2 text-studio-400">
        <Palette className="w-4 h-4" />
        <h4 className="text-sm font-medium">Khay Phong Cách Thẩm Mỹ (Mẫu Cài Sẵn)</h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STYLE_PRESETS.map((style) => (
          <button
            key={style.id}
            onClick={() => onApplyStyle(style.promptAddon)}
            className="flex flex-col text-left p-3 rounded-lg bg-studio-900 border border-white/5 hover:border-accent hover:bg-studio-800 transition-all group"
          >
            <span className="text-sm font-semibold text-studio-100 group-hover:text-accent transition-colors">{style.name}</span>
            <span className="text-[10px] text-studio-500 mt-1 line-clamp-2">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

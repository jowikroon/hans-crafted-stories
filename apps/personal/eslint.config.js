import baseConfig from "@hans/config/eslint";

export default [
  ...baseConfig,
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/portal/SortableToolCard.tsx",
      "src/components/command-center/HierarchyControls.tsx",
      "src/components/portal/MediaPickerContext.tsx",
      "src/contexts/PreloadedDataContext.tsx",
      "src/entry-server.tsx",
      "src/features/samantha/components/meta/*.tsx",
      "src/features/samantha/components/safety/*.tsx",
      "src/hooks/useAuth.tsx",
      "src/hooks/useLang.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
];

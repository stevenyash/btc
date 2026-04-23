---
name: add-component
description: Add a shadcn/ui component to the frontend-react project
command: cd frontend-react && npx shadcn@latest add {{component}}
args:
  - name: component
    description: The shadcn component name (e.g., card, button, input)
    required: true
    type: string
example: /add-component card
---

This command adds a shadcn/ui component to the React frontend project.

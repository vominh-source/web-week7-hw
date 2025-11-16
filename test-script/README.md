# Test Script

This folder contains a small test runner `test-all.ts` that posts orders to the OrderService.

Quick commands (PowerShell):

- Install dependencies (dev):

```powershell
cd C:\Users\ACER\Desktop\week7\test-script
npm install
```

- Run the test via npm script:

```powershell
cd C:\Users\ACER\Desktop\week7\test-script
npm run test-all
```

- Run directly with `ts-node` (uses `npx` if not installed):

```powershell
cd C:\Users\ACER\Desktop\week7\test-script
npx ts-node test-all.ts
```

Notes:

- `package.json` in this folder sets `"type": "module"` so files are treated as ESM.
- If you plan to run many TypeScript scripts here, install `ts-node` and `typescript` locally (done by `npm install`).
- Ensure OrderService is running on `http://localhost:3000` before executing the tests.

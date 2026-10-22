import process from 'node:process';
import { createSiteServer } from './static-server.mjs';

const port = Number(process.env.PORT ?? 4173);
const server = createSiteServer();
server.listen(port, '127.0.0.1', () => {
  console.log(`Serving site at http://127.0.0.1:${port}`);
});

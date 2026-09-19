import dns from 'node:dns';

// Atlas mongodb+srv URIs need SRV DNS lookups. These public resolvers avoid
// the Windows resolver issue that caused querySrv ECONNREFUSED locally.
dns.setServers(['1.1.1.1', '8.8.8.8']);
await import('./index.js');

import { Command } from 'commander';
import { registerConfigCommand } from './commands/config.js';
import { registerSessionCommands } from './commands/session.js';
import { registerMessagesCommands } from './commands/messages.js';
import { registerGroupsCommands } from './commands/groups.js';
import { registerCommunitiesCommands } from './commands/communities.js';
import { registerContactsCommands } from './commands/contacts.js';
import { registerUsersCommands } from './commands/users.js';
import { registerMediaCommands } from './commands/media.js';
import { registerChatsCommands } from './commands/chats.js';
import { registerCallsCommands } from './commands/calls.js';
import { registerNewslettersCommands } from './commands/newsletters.js';
import { registerStatusCommands } from './commands/status.js';
import { handleError } from './runner.js';

const program = new Command();

program
  .name('wsapi')
  .description('Command-line client for the WSAPI WhatsApp cloud API')
  .version('0.1.0')
  .option('--profile <name>', 'named profile from the config file')
  .option('--api-key <key>', 'WSAPI API key (overrides env and config)')
  .option('--instance-id <id>', 'WSAPI instance ID (overrides env and config)')
  .option('--base-url <url>', 'API base URL (default https://api.wsapi.chat)')
  .option('--config <path>', 'path to config file (default ~/.wsapi/config.json)');

registerConfigCommand(program);
registerSessionCommands(program);
registerMessagesCommands(program);
registerGroupsCommands(program);
registerCommunitiesCommands(program);
registerContactsCommands(program);
registerUsersCommands(program);
registerMediaCommands(program);
registerChatsCommands(program);
registerCallsCommands(program);
registerNewslettersCommands(program);
registerStatusCommands(program);

program.parseAsync(process.argv).catch(handleError);

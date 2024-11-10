import { promises as fs } from 'fs';
import { Tool } from '../../client/src/lib/types';

export const fileSystemTool: Tool = {
  name: 'fileSystem',
  description: 'Perform file system operations',
  enabled: true,
  parameters: {
    operation: {
      type: 'string',
      enum: ['read', 'write', 'list', 'delete']
    },
    path: {
      type: 'string'
    },
    content: {
      type: 'string',
      optional: true
    }
  },
  async execute({ operation, path, content }) {
    switch (operation) {
      case 'read':
        return await fs.readFile(path, 'utf-8');
      case 'write':
        await fs.writeFile(path, content);
        return 'File written successfully';
      case 'list':
        return await fs.readdir(path);
      case 'delete':
        await fs.unlink(path);
        return 'File deleted successfully';
      default:
        throw new Error('Invalid operation');
    }
  }
};

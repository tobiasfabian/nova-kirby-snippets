const {
  path,
  fs,
  workspace,
} = nova;

let kirbySnippets = [];
const configSnippetsPath = 'medienbaecker.kirby-snippets.config.snippetsPath';


function getSnippetsRelativePath() {
  let snippetsRelativePath = workspace.config.get(configSnippetsPath);
  snippetsRelativePath = snippetsRelativePath.endsWith('/') ? snippetsRelativePath : snippetsRelativePath + '/';
  snippetsRelativePath = snippetsRelativePath.startsWith('/') ? snippetsRelativePath : '/' + snippetsRelativePath;
  return snippetsRelativePath;
}


function updateKirbySnippets() {
  const snippetsPath = workspace.path + getSnippetsRelativePath();
  let snippetsPhpFiles = [];

  function createKirbySnippets() {
    // collect snippets
    getChildren(snippetsPath);

    // remove absolute path
    snippetsPhpFiles = snippetsPhpFiles.map(item => item.replace(snippetsPath, ''));
    // remove file extension
    return snippetsPhpFiles.map(item => item.replace('.php', ''));
  }

  // collects php files in snippet dir
  function getChildren(parentDir) {
    const dirList = fs.listdir(parentDir);
    for (const dirItem of dirList) {
      const childPath = parentDir + dirItem;
      const fileStats = fs.stat(childPath);
      if (fileStats.isDirectory()) {
        getChildren(childPath + '/');
      } else if (path.extname(childPath) === '.php') {
        snippetsPhpFiles.push(childPath);
      }
    }
  }

  if (fs.stat(snippetsPath) === undefined) {
    console.warn(`${snippetsPath} does not exist`);
  } else {
    kirbySnippets = createKirbySnippets();
    if (kirbySnippets.length === 0) {
      console.warn(`No snippets found at ${snippetsPath}`);
    } else {
      console.info('Kirby Snippets:', kirbySnippets);
    }
  }
}



exports.activate = function() {
  updateKirbySnippets();
  fs.watch(getSnippetsRelativePath() + '*', updateKirbySnippets);
  workspace.config.onDidChange(configSnippetsPath, updateKirbySnippets);
}

exports.deactivate = function() {
  // Clean up state before the extension is deactivated
}


class CompletionProvider {
  provideCompletionItems(editor, context) {
    let items = [];

    // HELP WANTED
    // There should be a better way to detect if the cursor is inside of <?php snippet('|')
    if (context.line.includes('snippet')) {
      for (const tag of kirbySnippets) {
        let item = new CompletionItem(tag, CompletionItemKind.Enum);
        item.insertText = tag;
        items.push(item);
      }
    }

    return items;
  }
}


nova.assistants.registerCompletionAssistant("php", new CompletionProvider());


'use strict';

// import * as path from 'path';
// import * as fs from 'fs';

import {
	TextDocument,
	TextEdit,
	Position,
	Range,
	CodeAction,
	CodeActionProvider,
	CodeActionKind,
	window,
	commands,
	workspace,
	ExtensionContext,
	WorkspaceFolder,
	languages,
	Uri,
	Command
} from 'vscode';
import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient';
import * as fs from 'fs';


const CompleteCommand = 'pasls.completeCode';
const InvokeCompleteCommand = 'invoke.codeCompletion';
const FormatCommand = 'pasls.formatCode';
const InvokeFormatCommand = 'invoke.formatCode';
const RemoveEmptyMethodsCommand = 'pasls.removeEmptyMethods'; 
const InvokeRemoveEmptyMethodsCommand = 'invoke.removeEmptyMethods'; 

let client: LanguageClient;
let completecmd: Command;

function invokeFormat(document: TextDocument, range: Range) {
	let activeEditor = window.activeTextEditor;
	if (!activeEditor) {
		window.showErrorMessage('No active editor.')
		return;
	}

	// Do we have a document ?
	let doc = document ? document : (activeEditor ? activeEditor.document : undefined);
	if (!doc) {
		window.showErrorMessage('No document available.')
		return;
	}
	let fn: string = doc ? doc.uri.fsPath : '';
	if (!fn) {
		window.showErrorMessage('Documents needs to be saved first.')
		return;
	}
	// Maybe check for extensions ? 
	if (doc.isDirty) doc.save();

	let formatConfig: string = workspace.getConfiguration('pascalLanguageServer').get('formatConfig') || '';
	if (formatConfig) {
		formatConfig = 'file://' + formatConfig;
		if (!fs.existsSync(formatConfig)) {
			window.showErrorMessage('Formatter config file does not exist: ' + formatConfig);
			return;
		}
	}

	if (doc.uri) {
		commands.executeCommand(FormatCommand, doc.uri.with({ "scheme": "file" }).toString(), formatConfig);
	}
}

function invokeRemoveEmptyMethods() {
	// Do we have a document ?
	let activeEditor = window.activeTextEditor;
	if (!activeEditor) {
		return;
	}
	
	let doc : TextDocument = activeEditor.document;
	if (!doc) {
		window.showErrorMessage('No document available.')
		return;
	}

	let pos : Position = activeEditor.selection.start;
	
	if (doc.uri) {
		commands.executeCommand(RemoveEmptyMethodsCommand, doc.uri.with({ "scheme": "file" }).toString(), pos);
	}
}



export function activate(context: ExtensionContext) {
	console.log("Greetings from pascal-language-server 🙏");

	// Load the path to the language server from settings
	let executable: string = workspace.getConfiguration('pascalLanguageServer').get("executable");

	// TODO: download the executable for the active platform
	// https://github.com/genericptr/pascal-language-server/releases/download/x86_64-darwin/pasls
	// if (!executable) {
	// 	let target = 'x86_64-darwin';
	// 	executable = context.asAbsolutePath(path.join('bin', target, 'pasls'));
	// }

	console.log("executable: " + executable);

	// load environment variables from settings which are used for CodeTools
	let userEnvironmentVariables = {};
	let keys: string[] = ['PP', 'FPCDIR', 'LAZARUSDIR', 'FPCTARGET', 'FPCTARGETCPU'];
	let settingEnvironmentVariables = workspace.getConfiguration('pascalLanguageServer.env');

	Object.keys(settingEnvironmentVariables).forEach(key => {
		if (keys.includes(key)) {
			if (settingEnvironmentVariables[key]) userEnvironmentVariables[key] = settingEnvironmentVariables[key];
		}
	});


	let run: Executable = {
		command: executable,
		options: {
			env: userEnvironmentVariables
		}
	};
	let debug: Executable = run;
	let serverOptions: ServerOptions = {
		run: run,
		debug: debug
	};

	let initializationOptions = workspace.getConfiguration('pascalLanguageServer.initializationOptions');

	// console.log(initializationOptions);

	// client extensions configure their server
	let clientOptions: LanguageClientOptions = {
		initializationOptions: initializationOptions,
		// workspaceFolder: folder,
		documentSelector: [
			{ scheme: 'file', language: 'pascal' },
			{ scheme: 'untitled', language: 'pascal' }
		]
	}

	client = new LanguageClient('pascal-language-server', 'Pascal Language Server', serverOptions, clientOptions);
	client.start();


	languages.registerDocumentFormattingEditProvider('pascal', {
		provideDocumentFormattingEdits(document: TextDocument): TextEdit[] {
			invokeFormat(document,new Range(new Position(0,0), new Position(document.lineCount,0)));
			return [];
		}
	});	
	const completecmd = commands.registerCommand(InvokeCompleteCommand, (document, range) => {
		let activeEditor = window.activeTextEditor;
		let curPos = activeEditor.selection.active;
		let doc = document ? document : activeEditor.document;
		let rng = range ? range : new Range(curPos, curPos);
		if (doc.uri && rng) {
			commands.executeCommand(CompleteCommand, doc.uri.with({ "scheme": "file" }).toString(), rng.start);
		}
	});

	context.subscriptions.push(completecmd);
	const formatcmd = commands.registerCommand(InvokeFormatCommand, invokeFormat)

	context.subscriptions.push(formatcmd);

	const removeemptymethodscmd = commands.registerCommand(InvokeRemoveEmptyMethodsCommand, invokeRemoveEmptyMethods)

	context.subscriptions.push(removeemptymethodscmd);


}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

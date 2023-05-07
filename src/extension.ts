'use strict';

// import * as path from 'path';
// import * as fs from 'fs';

import { 
	TextDocument,
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
	Command} from 'vscode';
import {
	Executable,
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient';

const
  CompleteCommand = 'pasls.completeCode';
const 
  InvokeCompleteCommand = 'invoke.codeCompletion';

let client: LanguageClient;
let completecmd : Command;

function CallCodeCompletion(document:TextDocument, location : Range) : any {
  
}

export class CodeCompleter implements CodeActionProvider {

	public static readonly providedCodeActionKinds = [
		CodeActionKind.RefactorRewrite
	];

	public provideCodeActions(document: TextDocument, range: Range): CodeAction[] | undefined {
		
		const completeAction = this.createCommand(document,range);

		return [
			completeAction
		];
	}	

	private createCommand(document: TextDocument, range: Range): CodeAction {
		const action = new CodeAction('Complete code...', CodeActionKind.RefactorRewrite);
		action.command = { 
			command: CompleteCommand, 
			title: 'Code completion', 
			tooltip: 'Try to complete the code at the current location.' ,
			arguments: [document.uri.with({"scheme":"file"}).toString(),range.start]
		};
		action.isPreferred = true;
		return action;
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

		console.log("executable: "+executable);

		// load environment variables from settings which are used for CodeTools
		let userEnvironmentVariables = {};
		let keys: string[] = ['PP', 'FPCDIR', 'LAZARUSDIR', 'FPCTARGET', 'FPCTARGETCPU'];
		let settingEnvironmentVariables = workspace.getConfiguration('pascalLanguageServer.env');

		Object.keys(settingEnvironmentVariables).forEach(key => {
			if (keys.includes(key)) {
				if (settingEnvironmentVariables[key]) userEnvironmentVariables[key] = settingEnvironmentVariables[key];
			}
		});
		

		let run: Executable = { command: executable,
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

		languages.registerCodeActionsProvider('pascal', new CodeCompleter(), {
	    providedCodeActionKinds: CodeCompleter.providedCodeActionKinds
		});

	 	const completecmd = commands.registerCommand(InvokeCompleteCommand, (document,range) => {
  	  let activeEditor = window.activeTextEditor;
		  let curPos = activeEditor.selection.active;
			let doc = document ? document : activeEditor.document;
			let rng = range ? range : new Range(curPos,curPos);
			commands.executeCommand(CompleteCommand,doc.uri.with({"scheme":"file"}).toString(),rng.start);
		});
	
		context.subscriptions.push(completecmd);		
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

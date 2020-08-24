
# Pascal Language Server Extension for Visual Studio Code

The language server `pasls` can be acquired at: http://github.com/genericptr/pascal-language-server.

## Installing

- Build the language server `pasls`.
- Package the extension as described in https://code.visualstudio.com/api/working-with-extensions/publishing-extension or use the `.vsix` package provided.
	```
	npm install -g vsce		# make sure vsce is installed
	cd /pasls-vscode		# cd to the extension direction
	vsce package			# run the package command
	```
- Install the packaged extension `pascal-language-server-x.x.x.vsix` using `Extensions Panel > Install from VSIX`.
- Configure settings for your system in `Preferences > Settings`.

*Note:* The language server and this extension are both under development and not yet considered stable.
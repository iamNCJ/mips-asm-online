import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {Range} from 'monaco-editor';
import {DefaultButton, Stack, IStackTokens, Text, Toggle, PrimaryButton} from "office-ui-fabric-react";
import { saveAs } from 'file-saver';

import "./App.css"
import assemble from "./asm"

const stackTokens: IStackTokens = {childrenGap: 40};

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            code: "# type your code... \n",
            debug: false,
            theme: "vs-dark",
            result: "Result",
            errorLine: []
        };
    }

    onChange = (newValue) => {
        this.setState({
            code: newValue,
            errorLine: this.editor.deltaDecorations(this.state.errorLine, [])
        });
        // this.state.errorLine
        // console.log("onChange", newValue); // eslint-disable-line no-console
    };

    editorDidMount = (editor) => {
        // eslint-disable-next-line no-console
        // console.log("editorDidMount", editor, editor.getValue(), editor.getModel());
        this.editor = editor;
    };

    onChangeDebug = (ev: React.MouseEvent<HTMLElement>, checked: boolean) => {
        this.setState({
            debug: checked
        });
    }

    assembleBtnFunc = () => {
        if (this.editor) {
            const code = this.editor.getValue();
            try {
                this.setState({
                        result: assemble(code, this.state.debug)
                    }
                );
            } catch (err) {
                if (err.name === 'ParseError') {
                    console.log();
                    this.setState({
                            result: err.name + ': Line ' + err.lineNum + ': ' + err.message,
                            errorLine: this.editor.deltaDecorations(this.state.errorLine, [{
                                range: new Range(err.lineNum, 1, err.lineNum, 1),
                                options: {
                                    isWholeLine: true,
                                    className: 'ErrorLine'
                                }
                            }])
                        }
                    );
                }
            }
        }
    };

    saveToFile = () => {
        var blob = new Blob([this.state.result], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "asm.coe");
    }

    render() {
        const {code, theme} = this.state;
        const options = {
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            automaticLayout: false,
        };
        return (
            <div>
                <div id="control">
                    <Stack horizontal tokens={stackTokens}>
                        <PrimaryButton text="Assemble" onClick={this.assembleBtnFunc}/>
                        <DefaultButton text="Save to File" onClick={this.saveToFile}/>
                        <Toggle label="Debug Mode" inlineLabel onText="On" offText="Off" onChange={this.onChangeDebug}/>
                    </Stack>
                </div>
                <hr/>
                <div id="editor">
                    <MonacoEditor
                        height="400"
                        width="100%"
                        language="mips"
                        value={code}
                        options={options}
                        onChange={this.onChange}
                        editorDidMount={this.editorDidMount}
                        theme={theme}
                    />
                </div>

                <hr/>
                <div id="result">
                    <Text>
                        {this.state.result.split("\n").map((i, key) => {
                            return <div key={key}>{i}</div>;
                        })}
                    </Text>
                </div>
            </div>
        );
    }
}

export default App;

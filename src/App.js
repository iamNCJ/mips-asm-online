import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { Range } from 'monaco-editor';
import { DefaultButton, Stack, IStackTokens, Text, Toggle } from "office-ui-fabric-react";
import { assemble } from "./asm"

const stackTokens: IStackTokens = { childrenGap: 40 };

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      code: "# type your code... \n",
      debug: false,
      theme: "vs-dark",
      result: "Result"
    };
  }

  onChange = (newValue) => {
    this.setState({code: newValue});
    // console.log("onChange", newValue); // eslint-disable-line no-console
  };

  editorDidMount = (editor) => {
    // eslint-disable-next-line no-console
    // console.log("editorDidMount", editor, editor.getValue(), editor.getModel());
    this.editor = editor;
  };

  onChangeDebug = (ev: React.MouseEvent<HTMLElement>, checked: boolean) => {
    this.setState( {
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
              this.setState({
                      result: err.name + ': Line ' + err.lineNum + ': ' + err.message
                  }
              );
              var decorations = this.editor.deltaDecorations([], [
                  {
                      range: new Range(err.lineNum,1,err.lineNum,1),
                      options: {
                          isWholeLine: true,
                          className: 'myContentClass',
                          glyphMarginClassName: 'myGlyphMarginClass'
                      }
                  }
              ]);
          }
      }
    }
  };

  render() {
    const { code, theme } = this.state;
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
              <DefaultButton text="Assemble" onClick={this.assembleBtnFunc} />
              <Toggle label="Debug Mode" inlineLabel onText="On" offText="Off" onChange={this.onChangeDebug} />
            </Stack>
          </div>
          <hr />
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
          <hr />
          <Text>
            {this.state.result.split("\n").map((i,key) => {
            return <div key={key}>{i}</div>;
            })}
          </Text>
        </div>
    );
  }
}

export default App;

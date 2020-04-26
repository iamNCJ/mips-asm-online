import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { DefaultButton, Stack, IStackTokens, Text } from "office-ui-fabric-react";
import { assemble } from "./asm"

const stackTokens: IStackTokens = { childrenGap: 40 };

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      code: "# type your code... \n",
      theme: "vs-dark",
      result: "Result"
    };
  }

  onChange = (newValue) => {
    // console.log("onChange", newValue); // eslint-disable-line no-console
  };

  editorDidMount = (editor) => {
    // eslint-disable-next-line no-console
    console.log("editorDidMount", editor, editor.getValue(), editor.getModel());
    this.editor = editor;
  };

  assembleBtnFunc = () => {
    if (this.editor) {
      const code = this.editor.getValue();
      this.setState({
        code: code,
        result: assemble(code)
      })
      // console.log(code)
      // this.resultCard.set(code);
      // alert(code);
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
          <div>
            <Stack horizontal tokens={stackTokens}>
              <DefaultButton text="Assemble" onClick={this.assembleBtnFunc} />
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

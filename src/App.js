import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {DefaultButton, Stack, IStackTokens, Text } from "office-ui-fabric-react";
import { Card } from '@uifabric/react-cards';

const stackTokens: IStackTokens = { childrenGap: 40 };

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      code: "// type your code... \n",
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

  assemble = () => {
    if (this.editor) {
      const code = this.editor.getValue();
      this.setState({
        code: code,
        result: code
      })
      console.log(code)
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
              <DefaultButton text="Assemble" onClick={this.assemble} />
            </Stack>
          </div>
          <hr />
          <Stack horizontal tokens={stackTokens}>
            <MonacoEditor
                height="400"
                width="50%"
                language="mips"
                value={code}
                options={options}
                onChange={this.onChange}
                editorDidMount={this.editorDidMount}
                theme={theme}
            />
            <Card
                width="50%"
                aria-label="Basic vertical card">
              <Card.Item>
                <Text >
                  {this.state.result.split("\n").map((i,key) => {
                  return <div key={key}>{i}</div>;
                  })}
                </Text>
              </Card.Item>
            </Card>
          </Stack>
        </div>
    );
  }
}

export default App;

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
    <React.StrictMode>
        <h1>
            MIPS Assembler Online
            <a href="https://github.com/iamNCJ/mips-asm-online/stargazers" id="star">
                <img src="https://img.shields.io/github/stars/iamNCJ/mips-asm-online.svg?label=Stars&style=social" alt="Stars" />
            </a>
        </h1>
        <App/>
    </React.StrictMode>,
    document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

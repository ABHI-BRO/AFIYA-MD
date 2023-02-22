/* Copyright (C) 2023 SUHAID-BRO.
Licensed under the  GPL-3.0 License;
you may not use this file except in compliance with the License.
Afiya-md
*/

var config = require("../config");
var commands = [];

function command(info, func) {
  let types = ['converter','downloader','game','group','heroku','tool','user','x-media','search','Textpro','Maker menu']
  var infos = info;
  infos.function = func;
  infos.pattern = new RegExp( `${config.HANDLERS}( ?${info.pattern})`,  `is` );
  if (!infos.dontAddCommandList) infos.dontAddCommandList = false;
  if (!infos.fromMe) infos.dontAddCommandList = false;
  if (!info.type||!types.includes(info.type)) infos.type = 'misc';
  commands.push(infos);
  return infos;
}
module.exports = {
  command,
  commands,
};

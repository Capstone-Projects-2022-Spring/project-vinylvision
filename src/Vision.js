import React from 'react'

function Vision() {
  return (
    <div>
      <form id="fileform" action="">
        <select name="type">
          <option value="WEB_DETECTION">WEB_DETECTION</option>
        </select><br />
      <input type="file" name="fileField"/><br /><br />
      <input type="submit" name="submit" value="Submit"/>
      </form>
    </div>
  )
}

export default Vision
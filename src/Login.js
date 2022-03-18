import { useEffect, useState } from "react";
import React from 'react'

function Login() {
    const CLIENT_ID = "d0525be4c5f740699430e39162f29ca4";
    const REDIRECT_URI = "https://tu-vinylvision.web.app";
    const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
    const RESPONSE_TYPE = "token";
    const SHOW_DIALOG = "true";
  
    const [token, setToken]  = useState("");
  
    useEffect( () => {
      const hash = window.location.hash
      let token = window.localStorage.getItem("token")
  
      if(!token && hash) {
        token = hash.substring(1).split("&").find(elem => elem.startsWith("access_token")).split("=")[1]
        
        window.location.hash = ""
        window.localStorage.setItem("token", token)
        setToken(token)
      }
    }, [])
  
    const logout = () => {
      setToken("")
      window.localStorage.removeItem("token")
    }
    return (
      <div className="Login">
          {!token ? <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&response_type=${RESPONSE_TYPE}&redirect_uri=${REDIRECT_URI}&show_dialog=${SHOW_DIALOG}`}>Login to Spotify</a> : <button onClick={logout}>Logout</button>}
      </div>
    );
  }

export default Login
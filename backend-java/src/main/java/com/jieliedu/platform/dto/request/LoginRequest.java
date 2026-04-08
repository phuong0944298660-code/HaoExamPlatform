package com.jieliedu.platform.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录请求
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    
    @JsonProperty("account")
    private String account;
    
    @JsonProperty("password")
    private String password;

    /**
     * 兼容前端可能发送的 username 字段
     */
    @JsonProperty("username")
    public void setUsername(String username) {
        if (this.account == null) {
            this.account = username;
        }
    }
}

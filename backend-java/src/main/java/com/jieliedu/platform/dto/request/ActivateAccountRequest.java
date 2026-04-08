package com.jieliedu.platform.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * 激活账号请求
 */
@Data
public class ActivateAccountRequest {
    private String account; // fallback for old username/identity identification
    
    @JsonProperty("identity_no")
    private String identityNo;
    
    private String username;
    
    private String name;
    
    @JsonProperty("activation_code")
    private String activationCode;
    
    private String password;
}

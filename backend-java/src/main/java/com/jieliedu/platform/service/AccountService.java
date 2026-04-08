package com.jieliedu.platform.service;

import com.jieliedu.platform.dto.request.ActivateAccountRequest;
import com.jieliedu.platform.dto.request.LoginRequest;
import com.jieliedu.platform.dto.response.LoginResponse;

/**
 * 账号服务接口
 */
public interface AccountService {

    LoginResponse activateAccount(ActivateAccountRequest request);

    LoginResponse login(LoginRequest request);

    java.util.Map<String, Object> batchGeneratePractice(com.jieliedu.platform.dto.request.BatchGeneratePracticeRequest request);
}

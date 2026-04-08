package com.jieliedu.platform.security;

import com.jieliedu.platform.entity.Account;
import com.jieliedu.platform.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 自定义用户详情服务
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    
    private final AccountRepository accountRepository;
    
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Account account = accountRepository.findByUsername(username)
                .orElseGet(() -> accountRepository.findByIdentityNo(username)
                        .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + username)));
        
        return UserPrincipal.create(account);
    }
    
    @Transactional(readOnly = true)
    public UserDetails loadUserById(@NonNull Integer id) {
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在: " + id));
        
        return UserPrincipal.create(account);
    }
}

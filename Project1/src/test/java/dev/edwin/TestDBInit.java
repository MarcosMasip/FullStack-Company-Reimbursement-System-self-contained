package dev.edwin;

import org.junit.jupiter.api.BeforeAll;

public class TestDBInit {
    @BeforeAll
    public static void setEmbeddedMode(){
        System.setProperty("DB_MODE","EMBEDDED");
    }
}
